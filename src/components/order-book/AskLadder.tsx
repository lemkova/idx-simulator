"use client";
import { memo } from "react";
import { OrderBookRow } from "./OrderBookRow";

interface AskLadderProps {
  levels: { price: number; totalQuantity: number; orderCount: number }[];
  maxVolume: number;
}

export const AskLadder = memo(function AskLadder({
  levels,
  maxVolume,
}: AskLadderProps) {
  const rows = [...levels].reverse();

  return (
    <div className="flex flex-col">
      {rows.map((level, i) => (
        <OrderBookRow
          key={`ask-${i}`}
          price={level.price}
          volume={level.totalQuantity}
          orderCount={level.orderCount}
          maxVolume={maxVolume}
          side="ask"
        />
      ))}
    </div>
  );
});
