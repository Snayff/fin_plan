import { describe, it, expect, mock, beforeEach } from 'bun:test';

const sendMailMock = mock(() => Promise.resolve({ messageId: 'test-id' }));
const createTransportMock = mock(() => ({ sendMail: sendMailMock }));
const getTestMessageUrlMock = mock(() => 'https://ethereal.email/message/test');
const createTestAccountMock = mock(() =>
  Promise.resolve({ user: 'test@ethereal.email', pass: 'password' })
);

mock.module('nodemailer', () => ({
  default: {
    createTransport: createTransportMock,
    createTestAccount: createTestAccountMock,
    getTestMessageUrl: getTestMessageUrlMock,
  },
}));

mock.module('../config/env.js', () => ({
  config: {
    NODE_ENV: 'test',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: 587,
    SMTP_USER: 'user@example.com',
    SMTP_PASS: 'secret',
    APP_URL: 'https://app.example.com',
    FROM_EMAIL: 'noreply@example.com',
  },
}));

import { sendInviteEmail } from './email.service';

beforeEach(() => {
  sendMailMock.mockClear();
  createTransportMock.mockClear();
  // Reset the cached transporter between tests by clearing the mock
  sendMailMock.mockResolvedValue({ messageId: 'test-id' });
});

describe('sendInviteEmail', () => {
  it('calls sendMail with the correct to, subject fields', async () => {
    await sendInviteEmail('invited@example.com', 'Smith Family', 'token-abc', 'Alice');

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const callArg = sendMailMock.mock.calls[0][0];
    expect(callArg.to).toBe('invited@example.com');
    expect(callArg.subject).toContain('Alice');
    expect(callArg.subject).toContain('Smith Family');
  });

  it('includes the accept URL with the token in the text body', async () => {
    await sendInviteEmail('invited@example.com', 'Smith Family', 'token-abc', 'Alice');

    const callArg = sendMailMock.mock.calls[0][0];
    expect(callArg.text).toContain('token-abc');
    expect(callArg.text).toContain('https://app.example.com/accept-invite');
  });

  it('includes the accept URL in the HTML body', async () => {
    await sendInviteEmail('invited@example.com', 'Smith Family', 'token-abc', 'Alice');

    const callArg = sendMailMock.mock.calls[0][0];
    expect(callArg.html).toContain('token-abc');
    expect(callArg.html).toContain('Accept Invitation');
  });
});
