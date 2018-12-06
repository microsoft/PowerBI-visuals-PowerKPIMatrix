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

import { BaseComponent } from "../baseComponent";
import { IVisualComponentConstructorOptions } from "../visualComponentConstructorOptions";

import { IColumnMappingDropDownComponentRenderOptions } from "./columnMappingDropDownComponentRenderOptions";
import { IColumnMappingDropDownComponentState } from "./columnMappingDropDownComponentState";

export class ColumnMappingDropDownComponent extends BaseComponent {
    private className: string = "columnMappingDropDownComponent";
    private containerClassName: string = "columnMappingDropDownComponent_container";

    private captionElement: Selection<any, any, any, any>;

    private captionClassName: string = "columnMappingDropDownComponent_caption";

    private captionTextSelector: CssConstants.ClassAndSelector
        = CssConstants.createClassAndSelector("columnMappingDropDownComponent_captionText");

    private captionIndicatorSelector: CssConstants.ClassAndSelector
        = CssConstants.createClassAndSelector("columnMappingDropDownComponent_captionIndicator");

    private helpMessageContainerClassName: string = "columnMappingDropDownComponent_captionIndicatorHelpMessageContainer";
    private helpMessageElement: Selection<any, any, any, any>;

    private pbiGlyphIcon: string = "glyphicon";
    private pbiGlyphInfoClassName: string = " pbi-glyph-info";

    private selectBoxSelector: CssConstants.ClassAndSelector = CssConstants.createClassAndSelector("columnMappingDropDownComponent_select");

    private name: string;

    constructor(options: IVisualComponentConstructorOptions) {
        super();

        this.element = options.element
            .append("div")
            .classed(this.className, true)
            .append("div")
            .classed(this.containerClassName, true);

        this.captionElement = this.element
            .append("div")
            .classed(this.captionClassName, true);

        this.helpMessageElement = this.element
            .append("div")
            .classed(this.helpMessageContainerClassName, true);
    }

    public render(options: IColumnMappingDropDownComponentRenderOptions): void {
        this.name = options.name;

        this.renderCaptionText(this.captionElement, this.name);
        this.renderCaptionIndicator(this.captionElement, options.helpMessage);

        this.renderSelectBox(options);
    }

    public getState(): IColumnMappingDropDownComponentState {
        return {
            [this.name]: this.getValue(),
        };
    }

    public clear(): void {
        this.captionElement
            .selectAll("*")
            .remove();

        super.clear();
    }

    public destroy(): void {
        this.captionElement.remove();
        this.captionElement = null;

        this.helpMessageElement.remove();
        this.helpMessageElement = null;

        super.destroy();
    }

    private renderCaptionText(
        selection: Selection<any, any, any, any>,
        text: string,
    ): void {
        const captionTextSelection: Selection<any, string, any, any> = selection
            .selectAll(this.captionTextSelector.selectorName)
            .data([text]);

        captionTextSelection
            .exit()
            .remove();

        captionTextSelection
            .enter()
            .append("div")
            .classed(this.captionTextSelector.className, true)
            .merge(captionTextSelection)
            .text((textValue: string) => textValue)
            .attr("title", (textValue: string) => textValue);
    }

    private renderCaptionIndicator(
        selection: Selection<any, any, any, any>,
        helpMessage: string,
    ): void {
        const captionIndicatorSelection: Selection<any, string, any, any> = selection
            .selectAll(this.captionIndicatorSelector.selectorName)
            .data(helpMessage ? [helpMessage] : []);

        captionIndicatorSelection
            .enter()
            .append("div")
            .classed(this.captionIndicatorSelector.className, true)
            .classed(this.pbiGlyphIcon, true)
            .classed(this.pbiGlyphInfoClassName, true)
            .on("mouseover", (message: string) => {
                const event: MouseEvent = require("d3").event;

                this.showHelpMessage(message, event.x, event.y);
            })
            .on("mouseleave", this.hideHelpMessage.bind(this));

        captionIndicatorSelection
            .exit()
            .remove();
    }

    private renderSelectBox(options: IColumnMappingDropDownComponentRenderOptions): void {
        const selectBoxSelection: Selection<any, IColumnMappingDropDownComponentRenderOptions, any, any> = this.element
            .selectAll(this.selectBoxSelector.selectorName)
            .data([options]);

        selectBoxSelection
            .exit()
            .remove();

        const mergedSelectBoxSelection = selectBoxSelection
            .enter()
            .append("select")
            .classed(this.selectBoxSelector.className, true)
            .merge(selectBoxSelection)
            .on("change", () => {
                const selectElement: HTMLSelectElement = require("d3").event.target as HTMLSelectElement;

                options.onChange(selectElement.value);
            });

        const optionSelection: Selection<any, string, any, any> = mergedSelectBoxSelection
            .selectAll("option")
            .data((renderOptions: IColumnMappingDropDownComponentRenderOptions) => renderOptions.values.sort());

        optionSelection
            .exit()
            .remove();

        optionSelection
            .enter()
            .append("option")
            .merge(optionSelection)
            .attr("value", (value: string) => value)
            .text((value: string) => value);

        if (options.selectedValue !== undefined) {
            (selectBoxSelection.node() as HTMLSelectElement).value = options.selectedValue;
        }
    }

    private showHelpMessage(helpMessage: string, x: number, y: number): void {
        const element: SVGElement = this.element.node() as SVGElement;
        const elementRect: ClientRect = element.getBoundingClientRect();

        const left: number = x - elementRect.left;

        this.helpMessageElement
            .text(helpMessage)
            .style("left", pixelConverter.toString(left))
            .style("display", "block");
    }

    private hideHelpMessage(): void {
        this.helpMessageElement.style("display", null);
    }

    private getValue(): string {
        const selectBoxSelection = this.element
            .select(this.selectBoxSelector.selectorName);

        return (selectBoxSelection
            .node() as HTMLSelectElement)
            .value;
    }
}
