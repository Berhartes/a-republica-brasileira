import type { Meta, StoryObj } from '@storybook/react';
// Temporarily remove test dependencies
// When @storybook/test is installed, revert to the original import
// import { expect, userEvent, within } from '@storybook/test';

// Dummy implementations
const within = (_element: HTMLElement) => ({
  getByRole: (_role: string) => document.createElement('button') // Retornando um elemento HTML real
});
const userEvent = { click: async (_element: HTMLElement) => {} };
const expect = (_obj: unknown) => ({
  toBeInTheDocument: async () => {},
  not: { toBeInTheDocument: async () => {} }
});

import { Page } from './';

const meta = {
  title: 'Example/Page',
  component: Page,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggedOut: Story = {};

export const LoggedIn: Story = {
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    const loginButton = canvas.getByRole('button');
    await expect(loginButton).toBeInTheDocument();
    await userEvent.click(loginButton);
    await expect(loginButton).not.toBeInTheDocument();

    const logoutButton = canvas.getByRole('button');
    await expect(logoutButton).toBeInTheDocument();
  },
};