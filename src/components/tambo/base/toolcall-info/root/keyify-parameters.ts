import type TamboAI from "@tambo-ai/typescript-sdk";


export function keyifyParameters(
  parameters: TamboAI.ToolCallParameter[] | undefined,
): Record<string, unknown> | undefined {
  if (!parameters) return;
  return Object.fromEntries(
    parameters.map((p) => [p.parameterName, p.parameterValue]),
  );
}
