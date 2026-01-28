'use client';

import { ConnectButton as RainbowConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet, AlertTriangle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ConnectButton() {
  return (
    <RainbowConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button onClick={openConnectModal} className="gap-2">
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button
                    onClick={openChainModal}
                    variant="destructive"
                    className="gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Wrong network
                  </Button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={openChainModal}
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                  >
                    {chain.hasIcon && (
                      <div
                        className="w-5 h-5 rounded-full overflow-hidden"
                        style={{ background: chain.iconBackground }}
                      >
                        {chain.iconUrl && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            className="w-5 h-5"
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>

                  <Button
                    onClick={openAccountModal}
                    variant="secondary"
                    size="sm"
                  >
                    {account.displayName}
                    {account.displayBalance && (
                      <span className="ml-1 text-muted-foreground">
                        ({account.displayBalance})
                      </span>
                    )}
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </RainbowConnectButton.Custom>
  );
}
