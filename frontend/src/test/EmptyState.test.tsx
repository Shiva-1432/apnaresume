import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from '../components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders title, description, and action button', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();

    render(
      <EmptyState
        title="No resumes yet"
        description="Upload your first resume to continue."
        actionLabel="Upload Resume"
        onAction={onAction}
      />
    );

    expect(screen.getByText('No resumes yet')).toBeInTheDocument();
    expect(screen.getByText('Upload your first resume to continue.')).toBeInTheDocument();

    const actionButton = screen.getByRole('button', { name: 'Upload Resume' });
    expect(actionButton).toBeInTheDocument();

    await user.click(actionButton);
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});