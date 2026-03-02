// Update this file when toast, modal, or confirm dialog conventions change.
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import { dismissToast, showError, showLoading, showSuccess } from '@/lib/toast';
import { PatternExample } from '../PatternExample';
import { PatternSection } from '../PatternSection';

function ToastDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button
        size="sm"
        variant="outline"
        onClick={() => showSuccess('Budget saved successfully')}
      >
        Trigger success toast
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => showError('Failed to save budget. Please try again.')}
      >
        Trigger error toast
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          const toastId = showLoading('Saving...');
          setTimeout(() => {
            dismissToast(toastId);
            showSuccess('Done!');
          }, 2000);
        }}
      >
        Trigger loading → success
      </Button>
    </div>
  );
}

function ModalDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Open modal
      </Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Edit goal">
        <p className="text-sm text-muted-foreground">
          Modal content goes here. Forms are rendered inside a Modal.
        </p>
        <div className="flex gap-3 mt-6">
          <Button size="sm">Save</Button>
          <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </Modal>
    </>
  );
}

function ConfirmDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="destructive" onClick={() => setOpen(true)}>
        Delete goal
      </Button>
      <ConfirmDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={() => { setOpen(false); showSuccess('Goal deleted'); }}
        title="Delete this goal?"
        message="This will permanently remove the goal and all its progress. This cannot be undone."
        confirmText="Delete"
        cancelText="Keep it"
        variant="danger"
      />
    </>
  );
}

export function FeedbackPatterns() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">Feedback</h2>
        <p className="text-sm text-muted-foreground mb-8">
          Transient feedback (toast) vs. blocking confirmation (dialogs). Choose based on
          whether the user needs to actively decide something.
        </p>
      </div>

      <PatternSection
        id="toast"
        title="Toast"
        description="Transient feedback for completed actions. Top-right position, auto-dismisses. Use the helpers from src/lib/toast.ts — never import react-hot-toast directly."
        useWhen={[
          'Confirming a successful action (save, delete, update)',
          'Reporting an error that occurred during a background action',
        ]}
        avoidWhen={[
          'Persistent errors that need acknowledgement — use an inline Alert',
          'Destructive actions requiring confirmation — use ConfirmDialog first',
        ]}
      >
        <PatternExample
          label="Interactive demo"
          code={`import { showSuccess, showError, showLoading, dismissToast } from '@/lib/toast';

// After a successful mutation:
showSuccess('Budget saved successfully');

// On mutation error:
showError((error as Error).message);

// For async operations with loading state:
const toastId = showLoading('Saving...');
// ...after async work:
dismissToast(toastId);
showSuccess('Done!');`}
        >
          <ToastDemo />
        </PatternExample>
      </PatternSection>

      <PatternSection
        id="modal"
        title="Modal"
        description="Used exclusively for create and edit forms. Content is a form component. Max width 500px. Always includes a form title and Cancel/Save buttons."
        useWhen={[
          'Create or edit flows (AccountForm, GoalForm, BudgetForm, etc.)',
          'Content that requires focused user input before returning to the page',
        ]}
        avoidWhen={[
          'Purely informational content that requires no input — consider inline or a Card instead',
          'Destructive confirmation — use ConfirmDialog instead',
        ]}
      >
        <PatternExample
          label="Interactive demo"
          code={`const [isOpen, setIsOpen] = useState(false);

<Button onClick={() => setIsOpen(true)}>Add goal</Button>

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Add goal">
  <GoalForm
    onSuccess={() => setIsOpen(false)}
    onCancel={() => setIsOpen(false)}
  />
</Modal>`}
        >
          <ModalDemo />
        </PatternExample>
      </PatternSection>

      <PatternSection
        id="confirm-dialog"
        title="Confirm Dialog"
        description="Gate for any irreversible or destructive action. Must be shown before the action executes. Never trigger a delete or data-loss action directly from a button click."
        useWhen={[
          'Deleting any record',
          'Any action that cannot be undone',
        ]}
        avoidWhen={[
          'Routine saves or edits — these do not need confirmation',
          'Non-destructive actions (adding, editing reversible data)',
        ]}
      >
        <PatternExample
          label="Interactive demo — variant='danger'"
          code={`const [isOpen, setIsOpen] = useState(false);

// Trigger:
<Button variant="destructive" onClick={() => setIsOpen(true)}>
  Delete goal
</Button>

// Dialog:
<ConfirmDialog
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onConfirm={async () => {
    await deleteMutation.mutateAsync(id);
    setIsOpen(false);
    showSuccess('Goal deleted');
  }}
  title="Delete this goal?"
  message="This will permanently remove the goal and all progress."
  confirmText="Delete"
  cancelText="Keep it"
  variant="danger"         // 'danger' | 'warning' | 'info'
  isLoading={deleteMutation.isPending}
/>`}
        >
          <ConfirmDemo />
        </PatternExample>
      </PatternSection>
    </div>
  );
}
