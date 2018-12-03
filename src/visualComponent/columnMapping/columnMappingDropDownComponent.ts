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

    export class ColumnMappingDropDownComponent extends BaseComponent {
        private className: string = "columnMappingDropDownComponent";
        private containerClassName: string = "columnMappingDropDownComponent_container";

        private captionElement: D3.Selection;

        private captionClassName: string = "columnMappingDropDownComponent_caption";
        private captionTextSelector: ClassAndSelector = createClassAndSelector("columnMappingDropDownComponent_captionText");
        private captionIndicatorSelector: ClassAndSelector = createClassAndSelector("columnMappingDropDownComponent_captionIndicator");

        private helpMessageContainerClassName: string = "columnMappingDropDownComponent_captionIndicatorHelpMessageContainer";
        private helpMessageElement: D3.Selection;

        private pbiGlyphIcon: string = "glyphicon";
        private pbiGlyphInfoClassName: string = " pbi-glyph-info";

        private selectBoxSelector: ClassAndSelector = createClassAndSelector("columnMappingDropDownComponent_select");

        private name: string;

        constructor(options: VisualComponentConstructorOptions) {
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

        public render(options: ColumnMappingDropDownComponentRenderOptions): void {
            this.name = options.name;

            this.renderCaptionText(this.captionElement, this.name);
            this.renderCaptionIndicator(this.captionElement, options.helpMessage);

            this.renderSelectBox(options);
        }

        private renderCaptionText(selection: D3.Selection, text: string): void {
            const captionTextSelection: D3.UpdateSelection = selection
                .selectAll(this.captionTextSelector.selector)
                .data([text]);

            captionTextSelection
                .enter()
                .append("div")
                .classed(this.captionTextSelector.class, true);

            captionTextSelection
                .text((text: string) => text)
                .attr("title", (text: string) => text);

            captionTextSelection
                .exit()
                .remove();
        }

        private renderCaptionIndicator(selection: D3.Selection, helpMessage: string): void {
            const captionIndicatorSelection: D3.UpdateSelection = selection
                .selectAll(this.captionIndicatorSelector.selector)
                .data(helpMessage ? [helpMessage] : []);

            captionIndicatorSelection
                .enter()
                .append("div")
                .classed(this.captionIndicatorSelector.class, true)
                .classed(this.pbiGlyphIcon, true)
                .classed(this.pbiGlyphInfoClassName, true)
                .on("mouseover", (message: string) => {
                    this.showHelpMessage(message, d3.event.x, d3.event.y);
                })
                .on("mouseleave", this.hideHelpMessage.bind(this));

            captionIndicatorSelection
                .exit()
                .remove();
        }

        private renderSelectBox(options: ColumnMappingDropDownComponentRenderOptions): void {
            const selectBoxSelection: D3.UpdateSelection = this.element
                .selectAll(this.selectBoxSelector.selector)
                .data([options]);

            selectBoxSelection
                .enter()
                .append("select")
                .classed(this.selectBoxSelector.class, true);

            selectBoxSelection
                .on("change", () => {
                    const selectElement: HTMLSelectElement = d3.event.target as HTMLSelectElement;

                    options.onChange(selectElement.value);
                });

            const optionSelection: D3.UpdateSelection = selectBoxSelection
                .selectAll("option")
                .data((options: ColumnMappingDropDownComponentRenderOptions) => options.values.sort());

            optionSelection
                .enter()
                .append("option");

            optionSelection
                .attr("value", (value: string) => value)
                .text((value: string) => value);

            optionSelection
                .exit()
                .remove();

            selectBoxSelection
                .exit()
                .remove();

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
                .style({
                    left: PixelConverter.toString(left),
                    "display": "block",
                });
        }

        private hideHelpMessage(): void {
            this.helpMessageElement.style("display", null);
        }

        private getValue(): string {
            const selectBoxSelection: D3.Selection = this.element
                .select(this.selectBoxSelector.selector);

            return (selectBoxSelection
                .node() as HTMLSelectElement)
                .value;
        }

        public getState(): ColumnMappingDropDownComponentState {
            return {
                [this.name]: this.getValue()
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
    }
}
