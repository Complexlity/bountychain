import { cn } from "@/lib/utils";

interface MaxWidthWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const MaxWidthWrapper: React.FC<
  React.PropsWithChildren<MaxWidthWrapperProps>
> = (props) => {
  // eslint-disable-next-line react/prop-types
  const { className, children, ...rest } = props;
  return (
    <div
      {...rest}
      className={cn("container mx-auto max-w-[1300px] px-8", className)}
    >
      {children}
    </div>
  );
};

export default MaxWidthWrapper;
