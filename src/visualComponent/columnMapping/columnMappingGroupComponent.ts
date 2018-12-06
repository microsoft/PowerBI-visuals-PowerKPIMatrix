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

import { BaseContainerComponent } from "../baseContainerComponent";
import { IVisualComponent } from "../visualComponent";
import { IVisualComponentConstructorOptions } from "../visualComponentConstructorOptions";

import { ColumnMappingDropDownComponent } from "./columnMappingDropDownComponent";
import { IColumnMappingDropDownComponentState } from "./columnMappingDropDownComponentState";
import { IColumnMappingGroupRenderOptions } from "./columnMappingGroupRenderOptions";

export class ColumnMappingGroupComponent extends BaseContainerComponent {
    private className: string = "columnMappingGroupComponent";

    private titleContainerSelector: CssConstants.ClassAndSelector
        = CssConstants.createClassAndSelector("columnMappingGroupComponent_titleContainer");

    private titleSelector: CssConstants.ClassAndSelector = CssConstants.createClassAndSelector("columnMappingGroupComponent_title");

    constructor(options: IVisualComponentConstructorOptions) {
        super();

        this.components = [];

        this.element = options.element
            .append("div")
            .classed(this.className, true);
    }

    public render(options: IColumnMappingGroupRenderOptions): void {
        this.renderTitle(options.title);
        this.renderComponents(options);
    }

    public getState(): IColumnMappingDropDownComponentState {
        const state: IColumnMappingDropDownComponentState = {};

        if (this.components) {
            this.components.forEach((component: IVisualComponent) => {
                const componentState: IColumnMappingDropDownComponentState = component.getState() as IColumnMappingDropDownComponentState;

                Object.keys(componentState).forEach((name: string) => {
                    state[name] = componentState[name];
                });
            });
        }

        return state;
    }

    private renderComponents(options: IColumnMappingGroupRenderOptions): void {
        this.components
            .splice(options.groups.length)
            .forEach((component: IVisualComponent) => {
                component.clear();
                component.destroy();
            });

        if (this.components.length < options.groups.length) {
            for (let index: number = this.components.length; index < options.groups.length; index++) {
                this.components.push(new ColumnMappingDropDownComponent({ element: this.element }));
            }
        }

        this.components.forEach((component: IVisualComponent, index: number) => {
            component.render(options.groups[index]);
        });
    }

    private renderTitle(title: string): void {
        const titleContainerSelection: Selection<any, string, any, any> = this.element
            .selectAll(this.titleContainerSelector.selectorName)
            .data(title ? [title] : []);

        titleContainerSelection
            .exit()
            .remove();

        const mergedTitleContainerSelection = titleContainerSelection
            .enter()
            .append("div")
            .classed(this.titleContainerSelector.className, true)
            .merge(titleContainerSelection);

        const titleSelection: Selection<any, string, any, any> = mergedTitleContainerSelection
            .selectAll(this.titleSelector.selectorName)
            .data((data) => [data]);

        titleSelection
            .exit()
            .remove();

        titleSelection
            .enter()
            .append("div")
            .classed(this.titleSelector.className, true)
            .merge(titleSelection)
            .text((text: string) => text)
            .attr("title", (titleAttr: string) => titleAttr);

    }
}
