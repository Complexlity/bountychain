import { useConnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

const ConnectWalletButton = () => {
  const { connect, connectors, isPending: isLoading } = useConnect();
  const handleConnect = async () => {
    const connector = connectors[0]; // Assuming you want to use the first available connector
    if (connector) {
      connect({ connector });
    }
  };

  return (
    <Button
      variant="outline"
      className="hidden sm:flex"
      onClick={handleConnect}
      disabled={isLoading}
    >
      <Wallet className="mr-2 h-4 w-4" />
      {isLoading ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
};

export default ConnectWalletButton;
