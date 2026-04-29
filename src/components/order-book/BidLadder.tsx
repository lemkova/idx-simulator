"use client";
import { memo } from "react";
import { OrderBookRow } from "./OrderBookRow";

interface BidLadderProps {
  levels: { price: number; totalQuantity: number; orderCount: number }[];
  maxVolume: number;
}

export const BidLadder = memo(function BidLadder({
  levels,
  maxVolume,
}: BidLadderProps) {
  return (
    <div className="flex flex-col justify-start flex-1">
      {levels.map((level, i) => (
        <OrderBookRow
          key={`bid-${i}`}
          price={level.price}
          volume={level.totalQuantity}
          orderCount={level.orderCount}
          maxVolume={maxVolume}
          side="bid"
        />
      ))}
    </div>
  );
});
