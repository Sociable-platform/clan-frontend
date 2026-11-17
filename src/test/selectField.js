import { screen } from '@testing-library/react';

/**
 * Picks an option of a SelectField, which is a button that opens a menu: press the button, then
 * the option by its visible label. `trigger` is the field's button (`getByLabelText('Reason')`).
 */
export async function chooseOption(user, trigger, optionLabel) {
  await user.click(trigger);
  await user.click(await screen.findByRole('menuitemradio', { name: optionLabel }));
}
