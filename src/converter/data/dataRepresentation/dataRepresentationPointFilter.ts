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

import { IDataRepresentationPoint } from "./dataRepresentationPoint";
import { IDataRepresentationPointGradientColor } from "./dataRepresentationPointGradientColor";

export class DataRepresentationPointFilter {
    public static create(): DataRepresentationPointFilter {
        return new DataRepresentationPointFilter();
    }

    private static instance: DataRepresentationPointFilter;

    constructor() {
        if (DataRepresentationPointFilter.instance) {
            return DataRepresentationPointFilter.instance;
        }

        DataRepresentationPointFilter.instance = this;
    }

    public isPointValid(point: IDataRepresentationPoint): boolean {
        return point
            && point.value !== null
            && point.value !== undefined
            && !isNaN(point.value);
    }

    public groupAndFilterByColor(
        points: IDataRepresentationPoint[],
        colors: string[],
        defaultColor: string,
    ): IDataRepresentationPointGradientColor[] {
        if (!colors || !colors.length) {
            return [{
                color: defaultColor,
                points: this.filter(points),
            }];
        }

        const gradientSet: IDataRepresentationPointGradientColor[] = [];

        colors.forEach((color: string, colorIndex: number) => {
            const currentGradient: IDataRepresentationPointGradientColor = gradientSet.slice(-1)[0];
            const point: IDataRepresentationPoint = points[colorIndex];

            if (this.isPointValid(point)) {
                if (!currentGradient) {
                    gradientSet.push({
                        color,
                        points: [point],
                    });
                } else if (currentGradient && currentGradient.color === color) {
                    currentGradient.points.push(point);
                } else if (currentGradient && currentGradient.color !== color) {
                    currentGradient.points.push(point);

                    gradientSet.push({
                        color,
                        points: [point],
                    });
                }
            }
        });

        return gradientSet;
    }

    public filter(points: IDataRepresentationPoint[]): IDataRepresentationPoint[] {
        return points.filter((point: IDataRepresentationPoint) => this.isPointValid(point));
    }
}
