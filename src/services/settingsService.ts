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

import powerbi from "powerbi-visuals-api";

export interface ISettingsServiceItem {
    objectName: string;
    selectionId: powerbi.visuals.ISelectionId;
    properties: any;
}

export class SettingsService {
    private hostServices: powerbi.extensibility.visual.IVisualHost;

    public set host(host: powerbi.extensibility.visual.IVisualHost) {
        this.hostServices = host;
    }

    public save(items: ISettingsServiceItem[]): void {
        const instances: powerbi.VisualObjectInstance[] = items.map((item: ISettingsServiceItem) => {
            const selector: powerbi.data.Selector = item.selectionId
                && item.selectionId.getSelector
                ? item.selectionId.getSelector()
                : null;

            return {
                objectName: item.objectName,
                properties: item.properties || {},
                selector,
            };
        });

        this.sendInstancesToHost(instances);
    }

    public sendInstancesToHost(instances: powerbi.VisualObjectInstance[]): void {
        if (!this.hostServices) {
            return;
        }

        const objectInstance: powerbi.VisualObjectInstancesToPersist = {
            replace: instances || [],
        };

        this.hostServices.persistProperties(objectInstance);
    }

    public destroy(): void {
        this.hostServices = null;
    }
}
