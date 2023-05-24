import { expect, test } from '@playwright/test'

test('can connect wallet', async ({ page: w3m, context, browserName }) => {
  await w3m.goto('./ManagedReact')

  const wallet = await context.newPage()
  const reactWalletPromise = wallet.goto('https://react-wallet.walletconnect.com/walletconnect')

  await expect(w3m.getByText('Connect your wallet')).not.toBeVisible()
  await w3m.getByText('Connect Wallet').click({ force: true })
  await expect(w3m.getByText('Connect your wallet')).toBeVisible()

  if (browserName === 'chromium') {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  }
  await w3m.locator('w3m-modal-header[title="Connect your wallet"] button').click()

  await reactWalletPromise

  const uriField = wallet.locator('input[type=text][placeholder^="e.g. wc:"]')
  await expect(uriField).toBeVisible()
  await uriField.focus()
  await expect(uriField).toBeFocused()

  // https://github.com/microsoft/playwright/issues/8114#issuecomment-1550404655
  const isMac = process.platform === 'darwin'
  const modifier = isMac ? 'Meta' : 'Control'
  console.log(`keys ${modifier}+KeyV`)
  await wallet.keyboard.press(`${modifier}+KeyV`)

  const connectButton = uriField.locator('..').getByText('Connect')
  await expect(connectButton).toBeEnabled()
  await connectButton.click()

  const sessionProposal = wallet.locator('[role=dialog]').filter({
    has: wallet.locator('h3').filter({ hasText: 'Session Proposal' })
  })
  await expect(sessionProposal).toBeVisible()
  const account1Buttons = await sessionProposal
    .locator('[role=button]')
    .filter({ hasText: 'Account 1' })
    .all()
  for (const button of account1Buttons) {
    await button.click()
  }

  await expect(w3m.getByText('0 ETH')).not.toBeVisible()

  // await sessionProposal.locator('button', { hasText: 'Approve' }).click()

  // .click() doesn't work for some reason (seems like recent change), so using keyboard instead
  const approveButton = sessionProposal.locator('button', { hasText: 'Approve' })
  await expect(approveButton).toBeVisible()
  await expect(approveButton).toBeEnabled()
  await approveButton.focus()
  await wallet.keyboard.press('Space')

  await expect(w3m.getByText('1 ETH')).toBeVisible()
})