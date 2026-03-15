import { beforeEach, describe, expect, it } from 'bun:test';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { Route, Routes } from 'react-router-dom';
import AcceptInvitePage from './AcceptInvitePage';
import { renderWithProviders } from '../../test/helpers/render';
import { setAuthenticated, setUnauthenticated } from '../../test/helpers/auth';
import { server } from '../../test/msw/server';

function renderAcceptInvitePage() {
  return renderWithProviders(
    <Routes>
      <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
    </Routes>,
    { initialEntries: ['/accept-invite/token-123'] }
  );
}

describe('AcceptInvitePage', () => {
  beforeEach(() => {
    setUnauthenticated();
  });

  it('shows masked email restriction for email-bound invites', async () => {
    renderAcceptInvitePage();

    await waitFor(() => {
      expect(
        screen.getByText(/this invite must be completed using the invited email address/i)
      ).toBeTruthy();
      expect(screen.getByText(/i\*\*\*\*\*\*@example.com/i)).toBeTruthy();
    });
  });

  it('shows backend mismatch error when logged-in user joins with the wrong account', async () => {
    setAuthenticated();
    server.use(
      http.post('/api/auth/invite/:token/join', () =>
        HttpResponse.json(
          {
            error: {
              message:
                'This invite is for a different email address. Please sign in with the invited account.',
              code: 'VALIDATION_ERROR',
              statusCode: 400,
            },
          },
          { status: 400 }
        )
      )
    );

    renderAcceptInvitePage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /join my household/i })).toBeTruthy();
    });

    await userEvent.click(screen.getByRole('button', { name: /join my household/i }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'This invite is for a different email address. Please sign in with the invited account.'
        )
      ).toBeTruthy();
    });
  });
});