/**
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

namespace powerbi.visuals.samples.powerKPIMatrix {
    // jsCommon
    import PixelConverter = jsCommon.PixelConverter;
    import ClassAndSelector = jsCommon.CssConstants.ClassAndSelector;
    import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;

    export class KPIIndicatorCellComponent extends TextCellComponent {
        private componentExtraClassName: string = "kpiIndicatorCellComponent";

        private indicatorClassName: ClassAndSelector = createClassAndSelector("kpiIndicatorCellComponent_indicator");

        private glyphClassName: string = "powerKPIMatrix_glyphIcon";

        private kpiIndicatorPositionLeftClassName: string = "kpiIndicatorPosition_left";
        private kpiIndicatorPositionRightClassName: string = "kpiIndicatorPosition_right";

        private kpiIndicatorRowDirectionClassName: string = "kpiIndicatorRowDirectionClassName";
        private kpiIndicatorColumnDirectionClassName: string = "kpiIndicatorColumnDirectionClassName";

        private kpiStatusHorizontalAlignmentCenterClassName: string = "kpiStatus_horizontalAlignment_center";

        constructor(options: VisualComponentConstructorOptions) {
            super(options);

            this.element.classed(this.componentExtraClassName, true);

            this.updateSize(this.width, this.height);
        }

        public render(options: KPIIndicatorCellRenderOptions): void {
            const kpiIndicatorSettings: IKPIIndicatorSettings = options
                .kpiIndicatorSettings
                .getCurrentKPI(options.kpiIndicatorIndex);

            options.fontSettings.kpiColor = kpiIndicatorSettings && kpiIndicatorSettings.color;

            this.updateElementsDirection(options.kpiIndicatorSettings.shouldWrap);
            this.updatePosition(options.kpiIndicatorSettings.position);

            this.renderIndicator(options, kpiIndicatorSettings);

            const value: string = options.fontSettings.isShown
                ? options.value
                : undefined;

            super.render({
                value,
                order: options.order,
                fontSettings: options.fontSettings,
            });

            this.applyCenterAlignment(
                options.kpiIndicatorSettings.isShown
                &&
                options.fontSettings.isShown
                &&
                options.fontSettings.alignment === HorizontalTextAlignment.center
            );
        }

        private applyCenterAlignment(shouldApply: boolean): void {
            if (!this.element) {
                return;
            }

            this.element.classed(
                this.kpiStatusHorizontalAlignmentCenterClassName,
                shouldApply
            );
        }

        private updateElementsDirection(shouldUseColumnDirection: boolean): void {
            if (!this.element) {
                return;
            }

            this.element
                .classed(this.kpiIndicatorColumnDirectionClassName, shouldUseColumnDirection)
                .classed(this.kpiIndicatorRowDirectionClassName, !shouldUseColumnDirection);
        }

        private updatePosition(position: KPIIndicatorPosition): void {
            if (!this.element) {
                return;
            }

            this.element
                .classed(this.kpiIndicatorPositionLeftClassName, position === KPIIndicatorPosition.left)
                .classed(this.kpiIndicatorPositionRightClassName, position === KPIIndicatorPosition.right);
        }

        private renderIndicator(
            options: KPIIndicatorCellRenderOptions,
            kpiIndicatorSettings: IKPIIndicatorSettings
        ): void {
            const nodeSelection: D3.UpdateSelection = this.element
                .selectAll(this.indicatorClassName.selector)
                .data(options.kpiIndicatorSettings.isShown ? [[]] : []);

            nodeSelection
                .enter()
                .append("div");

            const className: string = kpiIndicatorSettings.shape
                ? `${this.indicatorClassName.class} ${this.glyphClassName} ${kpiIndicatorSettings.shape}`
                : `${this.indicatorClassName.class}`;

            nodeSelection
                .attr({
                    "class": className,
                })
                .style({
                    color: kpiIndicatorSettings.color,
                    "font-size": PixelConverter.toString(
                        PixelConverter.fromPointToPixel(options.kpiIndicatorSettings.textFontSize)),
                });

            this.updateTextWrapping(nodeSelection, options.fontSettings.wrapText);

            nodeSelection
                .exit()
                .remove();
        }
    }
}
