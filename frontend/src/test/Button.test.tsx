import { render, screen } from '@testing-library/react';
import Button from '../components/ui/Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
  });

  it('shows spinner and disables button when loading=true', () => {
    render(<Button loading>Saving</Button>);
    const button = screen.getByRole('button', { name: /saving/i });
    expect(button).toBeDisabled();
    expect(screen.getByText('⏳')).toBeInTheDocument();
  });

  it('is disabled when disabled=true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeDisabled();
  });
});