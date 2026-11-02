import {
  type APIActionRowComponent,
  type APIButtonComponentWithCustomId,
  ComponentType,
} from "discord.js";

export type Row = APIActionRowComponent<APIButtonComponentWithCustomId>;

export const button = (
  custom_id: string,
  label: string,
  style: APIButtonComponentWithCustomId["style"],
): APIButtonComponentWithCustomId => ({ type: ComponentType.Button, custom_id, label, style });

export const row = (components: APIButtonComponentWithCustomId[]): Row => ({
  type: ComponentType.ActionRow,
  components,
});
