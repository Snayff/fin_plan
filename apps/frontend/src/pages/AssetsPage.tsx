import { useState } from "react";
import { TwoPanelLayout } from "../components/layout/TwoPanelLayout.js";
import { AssetsLeftPanel } from "../components/assets/AssetsLeftPanel.js";
import { AssetItemArea } from "../components/assets/AssetItemArea.js";
import { AccountItemArea } from "../components/assets/AccountItemArea.js";
import { useAssetsSummary } from "../hooks/useAssets.js";
import type { AssetType, AccountType } from "@finplan/shared";

type SelectedType = AssetType | AccountType;
const ASSET_TYPES: AssetType[] = ["Property", "Vehicle", "Other"];

export default function AssetsPage() {
  const [selected, setSelected] = useState<SelectedType>("Property");
  const { data: summary } = useAssetsSummary();

  const isAssetType = ASSET_TYPES.includes(selected as AssetType);

  return (
    <TwoPanelLayout
      left={<AssetsLeftPanel summary={summary} selected={selected} onSelect={setSelected} />}
      right={
        isAssetType ? (
          <AssetItemArea type={selected as AssetType} />
        ) : (
          <AccountItemArea type={selected as AccountType} />
        )
      }
    />
  );
}
