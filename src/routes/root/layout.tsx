import type { ReactNode } from "react";
import { DiscordInvite } from "../../components/DiscordPanel";
import { VersionInfo } from "../../components/VersionPanel";
import Shell from "../../layout/Shell";

type Props = {
  header: ReactNode;
  main: ReactNode;
};

export function RootLayout({ header, main }: Props) {
  return (
    <Shell
      header={header}
      main={main}
      footer={
        <>
          <DiscordInvite />
          <VersionInfo />
        </>
      }
    />
  );
}
