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
  // Natural order (best ask first), justify-end anchors best ask at bottom near spread
  return (
    <div className="flex flex-col justify-end min-h-full">
      {levels.map((level, i) => (
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
