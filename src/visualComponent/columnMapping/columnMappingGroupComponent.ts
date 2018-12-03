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
    import ClassAndSelector = jsCommon.CssConstants.ClassAndSelector;
    import createClassAndSelector = jsCommon.CssConstants.createClassAndSelector;

    export class ColumnMappingGroupComponent extends BaseContainerComponent {
        private className: string = "columnMappingGroupComponent";

        private titleContainerSelector: ClassAndSelector = createClassAndSelector("columnMappingGroupComponent_titleContainer");
        private titleSelector: ClassAndSelector = createClassAndSelector("columnMappingGroupComponent_title");

        constructor(options: VisualComponentConstructorOptions) {
            super();

            this.components = [];

            this.element = options.element
                .append("div")
                .classed(this.className, true);
        }

        public render(options: ColumnMappingGroupRenderOptions): void {
            this.renderTitle(options.title);
            this.renderComponents(options);
        }

        private renderComponents(options: ColumnMappingGroupRenderOptions): void {
            this.components
                .splice(options.groups.length)
                .forEach((component: VisualComponent) => {
                    component.clear();
                    component.destroy();
                });

            if (this.components.length < options.groups.length) {
                for (let index: number = this.components.length; index < options.groups.length; index++) {
                    this.components.push(new ColumnMappingDropDownComponent({ element: this.element }));
                }
            }

            this.components.forEach((component: VisualComponent, index: number) => {
                component.render(options.groups[index]);
            });
        }

        private renderTitle(title: string): void {
            const titleContainerSelection: D3.UpdateSelection = this.element
                .selectAll(this.titleContainerSelector.selector)
                .data(title ? [title] : []);

            titleContainerSelection
                .enter()
                .append("div")
                .classed(this.titleContainerSelector.class, true);

            const titleSelection: D3.UpdateSelection = titleContainerSelection
                .selectAll(this.titleSelector.selector)
                .data(data => [data]);

            titleSelection
                .enter()
                .append("div")
                .classed(this.titleSelector.class, true);

            titleSelection
                .text((title: string) => title)
                .attr("title", (title: string) => title);

            titleSelection
                .exit()
                .remove();

            titleContainerSelection
                .exit()
                .remove();
        }

        public getState(): ColumnMappingDropDownComponentState {
            const state: ColumnMappingDropDownComponentState = {};

            if (this.components) {
                this.components.forEach((component: VisualComponent) => {
                    const componentState: ColumnMappingDropDownComponentState = component.getState() as ColumnMappingDropDownComponentState;

                    Object.keys(componentState).forEach((name: string) => {
                        state[name] = componentState[name];
                    });
                });
            }

            return state;
        }
    }
}