/* eslint-disable @typescript-eslint/ban-ts-comment */
import { cn } from "@/lib/utils";

type Props = {
  from?: `from-${string}-${number}`;
  to?: `to-${string}-${number}`;
  via?: `via-${string}-${number}`;
  innerCircleSize?: number;
  outerCirclePadding?: number;
};

export function GradientSpinner(options: Props) {
  const {
    from = "from-cyan-500",
    to = "to-blue-500",
    via = "via-gray-300",
    innerCircleSize = 72,
    outerCirclePadding = 16,
  } = options;

  return (
    <div
      style={{
        //@ts-ignore: css variable definition is supported in JSX style
        "--paddingSize": `${outerCirclePadding}px`,
      }}
      className={cn(
        `p-[--paddingSize] bg-gradient-to-tr animate-spin rounded-full w-fit h-fit`,
        from,
        to,
        via
      )}
    >
      <div
        style={{
          //@ts-ignore: css variable definition is supported in JSX style
          "--size": `${innerCircleSize}px`,
        }}
        className={cn(`w-[--size] h-[--size] rounded-full bg-white`)}
      ></div>
    </div>
  );
}
