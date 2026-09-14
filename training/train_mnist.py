"""Small CPU MNIST experiment matching the training walkthrough questions.

Only load checkpoints you created or otherwise trust. Output directories are local.
"""
import argparse
import json
import platform
from pathlib import Path
import torch
from torch import nn
from torch.utils.data import DataLoader, Subset, random_split
from torchvision.datasets import MNIST
from torchvision.transforms import ToTensor


def make_model():
    return nn.Sequential(nn.Flatten(), nn.Linear(784, 128), nn.ReLU(), nn.Linear(128, 10))


def evaluate(model, loader, criterion):
    model.eval()
    loss_sum = correct = count = 0
    with torch.no_grad():
        for images, labels in loader:
            logits = model(images)
            loss_sum += criterion(logits, labels).item() * len(labels)
            correct += (logits.argmax(dim=1) == labels).sum().item()
            count += len(labels)
    return {'loss': loss_sum / count, 'accuracy': correct / count, 'samples': count}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--data-dir', type=Path, default=Path('data'))
    parser.add_argument('--output', type=Path, default=Path('runs/mnist'))
    parser.add_argument('--epochs', type=int, default=3)
    parser.add_argument('--lr', type=float, default=0.001)
    parser.add_argument('--batch-size', type=int, default=32)
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--resume', type=Path)
    args = parser.parse_args()
    if args.epochs < 1 or args.lr <= 0 or args.batch_size < 1:
        parser.error('epochs, lr and batch-size must be positive')
    args.output.mkdir(parents=True, exist_ok=True)
    torch.set_num_threads(2)
    torch.manual_seed(args.seed)
    # Official training split is partitioned; official test split stays independent.
    dataset = MNIST(args.data_dir, train=True, download=True, transform=ToTensor())
    split_generator = torch.Generator().manual_seed(args.seed)
    train_pool, val = random_split(dataset, [58000, 2000], generator=split_generator)
    train = Subset(train_pool, range(10000))  # Deliberately small teaching run.
    order_generator = torch.Generator().manual_seed(args.seed + 1)
    train_loader = DataLoader(train, batch_size=args.batch_size, shuffle=True, num_workers=0, generator=order_generator)
    val_loader = DataLoader(val, batch_size=256, shuffle=False, num_workers=0)
    model, criterion = make_model(), nn.CrossEntropyLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=args.lr)
    config = {'seed': args.seed, 'batch_size': args.batch_size, 'lr': args.lr, 'train_samples': 10000, 'val_samples': 2000}
    report = {'data': 'MNIST, real data; CPU teaching subset', 'torch': str(torch.__version__), 'python': platform.python_version(), 'config': config, 'epochs': []}
    start, best_loss, best_state = 0, float('inf'), None
    if args.resume:
        checkpoint = torch.load(args.resume, map_location='cpu', weights_only=True)
        if checkpoint['config'] != config:
            raise ValueError('Resume with the same seed, batch size and lr')
        model.load_state_dict(checkpoint['model'])
        optimizer.load_state_dict(checkpoint['optimizer'])
        torch.set_rng_state(checkpoint['rng'])
        order_generator.set_state(checkpoint['loader_rng'])
        start, best_loss, best_state = checkpoint['epoch'], checkpoint['best_loss'], checkpoint['best_model']
        report = checkpoint['report']
    for epoch in range(start, args.epochs):
        model.train()
        loss_sum = correct = count = 0
        for step, (images, labels) in enumerate(train_loader):
            optimizer.zero_grad(set_to_none=True)
            logits = model(images)
            loss = criterion(logits, labels)
            before = model[1].weight.detach().clone() if epoch == 0 and step == 0 else None
            loss.backward()
            if before is not None:
                report['first_batch'] = {'images_shape': list(images.shape), 'images_dtype': str(images.dtype), 'labels_shape': list(labels.shape), 'labels_dtype': str(labels.dtype), 'logits_shape': list(logits.shape), 'loss': loss.item(), 'backward_changed_weights': not torch.equal(before, model[1].weight), 'grad_norm': model[1].weight.grad.norm().item()}
            optimizer.step()
            if before is not None:
                report['first_batch']['step_weight_change_norm'] = (model[1].weight.detach() - before).norm().item()
            loss_sum += loss.item() * len(labels)
            correct += (logits.argmax(1) == labels).sum().item()
            count += len(labels)
        validation = evaluate(model, val_loader, criterion)
        metrics = {'epoch': epoch + 1, 'steps': len(train_loader), 'train_loss': loss_sum/count, 'train_accuracy': correct/count, 'validation': validation}
        report['epochs'].append(metrics)
        print(json.dumps(metrics), flush=True)
        if validation['loss'] < best_loss:
            best_loss = validation['loss']
            best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
            torch.save(best_state, args.output / 'best_weights.pt')
        torch.save({'epoch': epoch + 1, 'model': model.state_dict(), 'optimizer': optimizer.state_dict(), 'rng': torch.get_rng_state(), 'loader_rng': order_generator.get_state(), 'config': config, 'best_loss': best_loss, 'best_model': best_state, 'report': report}, args.output / 'last_checkpoint.pt')
    if best_state is None:
        raise ValueError('No trained model available')
    # Select by validation only; test evaluation happens once after training.
    torch.save(best_state, args.output / 'best_weights.pt')
    restored = make_model()
    restored.load_state_dict(torch.load(args.output/'best_weights.pt', map_location='cpu', weights_only=True))
    test = MNIST(args.data_dir, train=False, download=True, transform=ToTensor())
    test_loader = DataLoader(test, batch_size=256, shuffle=False, num_workers=0)
    report['test'] = evaluate(restored, test_loader, criterion)
    model.load_state_dict(best_state);model.eval();restored.eval()
    images, _ = next(iter(test_loader))
    with torch.no_grad():
        report['reload_logits_match'] = torch.equal(model(images), restored(images))
        report['sample_prediction'] = int(restored(images[:1]).argmax(1).item())
    report['parameter_count'] = sum(p.numel() for p in model.parameters())
    (args.output/'metrics.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print('Saved metrics and checkpoints to', args.output)


if __name__ == '__main__':
    main()
