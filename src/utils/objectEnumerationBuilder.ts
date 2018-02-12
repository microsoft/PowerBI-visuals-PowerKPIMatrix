/*
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

namespace powerbi.extensibility.visual {
    import Selector = powerbi.data.Selector;
    /**
     * A helper class for building a VisualObjectInstanceEnumerationObject:
     * - Allows call chaining (e.g., builder.pushInstance({...}).pushInstance({...})
     * - Allows creating of containers (via pushContainer/popContainer)
     */
    export class ObjectEnumerationBuilder {
        private instances: powerbi.VisualObjectInstance[];
        private containers: VisualObjectInstanceContainer[];
        private containerIdx: number;

        constructor() {
            this.instances = [];
            this.containers = [];
        }

        public pushInstance(instance: VisualObjectInstance): ObjectEnumerationBuilder {
            let containerIdx = this.containerIdx;
            if (containerIdx != null) {
                instance.containerIdx = containerIdx;
            }

            for (let existingInstance of this.instances) {
                if (this.canMerge(existingInstance, instance)) {
                    this.extend(existingInstance, instance, 'properties');
                    this.extend(existingInstance, instance, 'validValues');

                    return this;
                }
            }

            this.instances.push(instance);

            return this;
        }

        public pushContainer(container: VisualObjectInstanceContainer): ObjectEnumerationBuilder {
            this.containerIdx = this.containers.push(container) - 1;
            return this;
        }

        public popContainer(): ObjectEnumerationBuilder {
            this.containerIdx = undefined;
            return this;
        }

        public complete(): VisualObjectInstanceEnumerationObject {
            if (this.instances.length === 0)
                return;

            return {
                instances: this.instances,
                containers: this.containers.length > 0 ? this.containers : undefined
            };
        }

        private canMerge(x: VisualObjectInstance, y: VisualObjectInstance): boolean {
            return x.objectName === y.objectName
                && x.containerIdx === y.containerIdx
                && x.selector.id === x.selector.id
                && x.selector.metadata === x.selector.metadata;

            // && Selector.equals(x.selector, y.selector);
        }

        private extend(target: VisualObjectInstance, source: VisualObjectInstance, propertyName: string): void {
            let sourceValues = source[propertyName];
            if (!sourceValues)
                return;

            let targetValues = target[propertyName];
            if (!targetValues)
                targetValues = target[propertyName] = {};

            for (let valuePropertyName in sourceValues) {
                targetValues[valuePropertyName] = targetValues[valuePropertyName] || sourceValues[valuePropertyName];
            }
        }
    }
}