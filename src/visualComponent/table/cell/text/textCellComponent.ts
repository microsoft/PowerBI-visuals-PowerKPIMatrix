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

    export class TextCellComponent extends CellComponent {
        private componentClassName: string = "textCellComponent";

        private textSelector: ClassAndSelector = createClassAndSelector("textCellComponent_text");
        private textHyperlinkClassName: string = "textCellComponent_text_hyperlink";

        private imageSelector: ClassAndSelector = createClassAndSelector("textCellComponent_image");

        constructor(options: VisualComponentConstructorOptions) {
            super(options);

            this.element.classed(this.componentClassName, true);

            this.updateSize(this.width, this.height);
        }

        public render(options: TextCellRenderOptions): void {
            const {
                fontSettings: {
                    alignment,
                backgroundColor,
                verticalAlignment,
                },
                order,
            } = options;

            this.updateOrder(order);

            this.updateBackgroundColor(
                this.element,
                backgroundColor
            );

            this.updateAlignment(this.element, alignment, verticalAlignment);
            this.renderElements(options);
        }

        protected renderElements(options: TextCellRenderOptions): void {
            this.applyFontSettings(options.fontSettings);

            this.renderImage(options);
            this.renderText(options);
        }

        private applyFontSettings(fontSettings: FontSettings): void {
            this.element.style({
                "font-size": fontSettings
                    ? PixelConverter.toString(PixelConverter.fromPointToPixel(fontSettings.textFontSize))
                    : null,
                "font-family": fontSettings ? fontSettings.fontFamily : null,
            });
        }

        protected renderImage(options: TextCellRenderOptions): void {
            const {
                image,
                hyperlink,
                fontSettings,
                hyperlinkAdapter,
            } = options;

            const isImageSpecified: boolean = !!image;

            fontSettings.updateImageVisibility(isImageSpecified);

            const imageSelection: D3.UpdateSelection = this.element
                .selectAll(this.imageSelector.selector)
                .data(isImageSpecified && fontSettings.shouldShowImage
                    ? [image]
                    : []
                );

            imageSelection
                .enter()
                .append("div")
                .classed(this.imageSelector.class, true);

            this.bindHyperlinkHandler(
                imageSelection,
                hyperlink,
                hyperlinkAdapter
            );

            const width: string = fontSettings.imageIconWidth
                ? PixelConverter.toString(fontSettings.imageIconWidth)
                : null;

            const height: string = fontSettings.imageIconWidth
                ? PixelConverter.toString(fontSettings.imageIconHeight)
                : null;

            imageSelection
                .style({
                    "background-image": `url(${image})`,
                    width,
                    "min-width": width,
                    height,
                    "min-height": height,
                });

            imageSelection
                .exit()
                .remove();
        }

        protected renderText(options: TextCellRenderOptions): void {
            const {
                image,
                value,
                hyperlink,
                fontSettings,
                hyperlinkAdapter,
            } = options;

            const isHyperlinkSpecified: boolean = !!hyperlink;

            fontSettings.updateHyperlinkVisibility(isHyperlinkSpecified);

            const textSelection: D3.UpdateSelection = this.element
                .selectAll(this.textSelector.selector)
                .data(value !== undefined
                    && value !== null
                    && (fontSettings.shouldShowLabel || (!image && !fontSettings.shouldShowLabel))
                    ? [value]
                    : []
                );

            textSelection
                .enter()
                .append("div")
                .classed(this.textSelector.class, true);

            this.bindHyperlinkHandler(
                textSelection,
                hyperlink,
                hyperlinkAdapter
            );

            textSelection
                .text((textValue: string) => textValue)
                .style({
                    "color": fontSettings.getColor(isHyperlinkSpecified),
                    "text-decoration": fontSettings.isTextUnderlined(isHyperlinkSpecified)
                        ? "underline"
                        : null,
                })
                .classed(this.textHyperlinkClassName, isHyperlinkSpecified)
                .classed(this.boldClassName, fontSettings && fontSettings.isBold)
                .classed(this.italicClassName, fontSettings && fontSettings.isItalic);

            this.updateTextWrapping(textSelection, fontSettings.wrapText);

            textSelection
                .exit()
                .remove();
        }

        protected bindHyperlinkHandler(
            element: D3.Selection,
            hyperlink: string,
            hyperlinkAdapter: HyperlinkAdapter
        ): void {
            if (!element) {
                return;
            }

            element
                .attr({
                    title: hyperlink || null
                })
                .on("click", !!hyperlink
                    ? this.openHyperlink.bind(this, hyperlinkAdapter, hyperlink)
                    : null
                );
        }

        protected openHyperlink(hyperlinkAdapter: HyperlinkAdapter, hyperlink: string): void {
            if (hyperlinkAdapter) {
                hyperlinkAdapter.open(hyperlink);
            }

            if (d3.event && d3.event.stopPropagation) {
                d3.event.stopPropagation();
            }
        }
    }
}