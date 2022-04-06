import type { ReactNode } from "react";
import React from "react";

import type { DrawingContext } from "../DrawingContext";
import { processPaint, selectPaint } from "../processors";
import type { AnimatedProps } from "../processors/Animations/Animations";
import { materialize } from "../processors/Animations/Animations";
import { isPaint } from "../../skia";
import type { DependencyManager } from "../DependencyManager";

import { Node } from "./Node";

type DrawingCallback<P> = (
  ctx: DrawingContext,
  props: P,
  node: Node<P>
) => void;

type OnDrawCallback<P> = (ctx: DrawingContext, props: P, node: Node<P>) => void;

export const createDrawing = <P,>(cb: OnDrawCallback<P>): DrawingCallback<P> =>
  cb;

export type DrawingProps<T> = {
  onDraw: DrawingCallback<T>;
  skipProcessing?: boolean;
  drawingType?: string;
  children?: ReactNode | ReactNode[];
};

export const Drawing = <P,>(props: DrawingProps<P>) => {
  return <skDrawing {...props} />;
};

export class DrawingNode<P> extends Node<P> {
  onDraw: DrawingCallback<P>;
  skipProcessing: boolean;
  drawingType: string | undefined;

  constructor(
    depMgr: DependencyManager,
    onDraw: DrawingCallback<P>,
    skipProcessing: boolean,
    drawingType: string | undefined,
    props: AnimatedProps<P>
  ) {
    super(depMgr, props);
    this.onDraw = onDraw;
    this.skipProcessing = skipProcessing;
    this.drawingType = drawingType;
  }

  descriptor() {
    return {
      drawingType: this.drawingType,
      props: this.props,
    };
  }

  draw(ctx: DrawingContext) {
    const drawingProps = materialize(this.props);
    if (this.skipProcessing) {
      this.onDraw(ctx, drawingProps, this);
    } else {
      const selectedPaint = selectPaint(ctx.paint, drawingProps);
      processPaint(selectedPaint, ctx.opacity, drawingProps);
      // to draw only once:
      // onDraw({ ...ctx, paint: selectedPaint }, children);
      [
        selectedPaint,
        ...this.children
          .map((child) => {
            //if (child.type === NodeType.Declaration) {
            const ret = child.draw(ctx);
            if (ret) {
              return ret;
            }
            //}
            return null;
          })
          .filter(isPaint),
      ].forEach((paint) => {
        this.onDraw({ ...ctx, paint }, drawingProps, this);
      });
    }
  }
}
