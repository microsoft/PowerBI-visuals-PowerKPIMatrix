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

import { Selection } from "d3-selection";

import { CssConstants } from "powerbi-visuals-utils-svgutils";
import { pixelConverter } from "powerbi-visuals-utils-typeutils";

import { IVisualComponentConstructorOptions } from "../../../visualComponentConstructorOptions";
import { CellComponent } from "../cellComponent";

import { ITextCellRenderOptions } from "./textCellRenderOptions";

import { HyperlinkAdapter } from "../../../../hyperlink/hyperlinkAdapter";
import { FontSettings } from "../../../../settings/descriptors/fontSettings";

export class TextCellComponent extends CellComponent {
    private componentClassName: string = "textCellComponent";

    private textSelector: CssConstants.ClassAndSelector = CssConstants.createClassAndSelector("textCellComponent_text");
    private textHyperlinkClassName: string = "textCellComponent_text_hyperlink";

    private imageSelector: CssConstants.ClassAndSelector = CssConstants.createClassAndSelector("textCellComponent_image");

    constructor(options: IVisualComponentConstructorOptions) {
        super(options);

        this.element.classed(this.componentClassName, true);

        this.updateSize(this.width, this.height);
    }

    public render(options: ITextCellRenderOptions): void {
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
            backgroundColor,
        );

        this.updateAlignment(this.element, alignment, verticalAlignment);
        this.renderElements(options);
    }

    protected renderImage(options: ITextCellRenderOptions): void {
        const {
            image,
            hyperlink,
            fontSettings,
            hyperlinkAdapter,
        } = options;

        const isImageSpecified: boolean = !!image;

        fontSettings.updateImageVisibility(isImageSpecified);

        const imageSelection: Selection<any, string, any, any> = this.element
            .selectAll(this.imageSelector.selectorName)
            .data(isImageSpecified && fontSettings.shouldShowImage
                ? [image]
                : [],
            );

        imageSelection
            .exit()
            .remove();

        const mergedImageSelection = imageSelection
            .enter()
            .append("div")
            .classed(this.imageSelector.className, true)
            .merge(imageSelection);

        this.bindHyperlinkHandler(
            mergedImageSelection,
            hyperlink,
            hyperlinkAdapter,
        );

        const width: string = fontSettings.imageIconWidth
            ? pixelConverter.toString(fontSettings.imageIconWidth)
            : null;

        const height: string = fontSettings.imageIconWidth
            ? pixelConverter.toString(fontSettings.imageIconHeight)
            : null;

        mergedImageSelection
            .style("background-image", `url(${image})`)
            .style("width", width)
            .style("min-width", width)
            .style("height", height)
            .style("min-height", height);
    }

    protected renderText(options: ITextCellRenderOptions): void {
        const {
            image,
            value,
            hyperlink,
            fontSettings,
            hyperlinkAdapter,
        } = options;

        const isHyperlinkSpecified: boolean = !!hyperlink;

        fontSettings.updateHyperlinkVisibility(isHyperlinkSpecified);

        const textSelection: Selection<any, string, any, any> = this.element
            .selectAll(this.textSelector.selectorName)
            .data(value !== undefined
                && value !== null
                && (fontSettings.shouldShowLabel || (!image && !fontSettings.shouldShowLabel))
                ? [value]
                : [],
            );

        textSelection
            .exit()
            .remove();

        const mergedTextSelection = textSelection
            .enter()
            .append("div")
            .classed(this.textSelector.className, true)
            .merge(textSelection);

        this.bindHyperlinkHandler(
            mergedTextSelection,
            hyperlink,
            hyperlinkAdapter,
        );

        mergedTextSelection
            .text((textValue: string) => textValue)
            .style("color", fontSettings.getColor(isHyperlinkSpecified))
            .style("text-decoration", fontSettings.isTextUnderlined(isHyperlinkSpecified)
                ? "underline"
                : null,
            )
            .classed(this.textHyperlinkClassName, isHyperlinkSpecified)
            .classed(this.boldClassName, fontSettings && fontSettings.isBold)
            .classed(this.italicClassName, fontSettings && fontSettings.isItalic);

        this.updateTextWrapping(mergedTextSelection, fontSettings.wrapText);
    }

    protected bindHyperlinkHandler(
        element: Selection<any, any, any, any>,
        hyperlink: string,
        hyperlinkAdapter: HyperlinkAdapter,
    ): void {
        if (!element) {
            return;
        }

        element
            .attr("title", hyperlink || null)
            .on("click", !!hyperlink
                ? this.openHyperlink.bind(this, hyperlinkAdapter, hyperlink)
                : null,
            );
    }

    protected openHyperlink(hyperlinkAdapter: HyperlinkAdapter, hyperlink: string): void {
        if (hyperlinkAdapter) {
            hyperlinkAdapter.open(hyperlink);
        }

        const event: Event = require("d3").event;

        if (event && event.stopPropagation) {
            event.stopPropagation();
        }
    }

    protected renderElements(options: ITextCellRenderOptions): void {
        this.applyFontSettings(options.fontSettings);

        this.renderImage(options);
        this.renderText(options);
    }

    private applyFontSettings(fontSettings: FontSettings): void {
        this.element
            .style("font-size", fontSettings
                ? pixelConverter.toString(pixelConverter.fromPointToPixel(fontSettings.textFontSize))
                : null,
            )
            .style("font-family", fontSettings ? fontSettings.fontFamily : null);
    }
}
