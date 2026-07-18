import { getComponentCatalogue } from "@opentui/solid/components"
import { registerSpinner } from "opentui-spinner/solid"

export function registerIgrisSpinner() {
  if (!getComponentCatalogue().spinner) registerSpinner()
}
