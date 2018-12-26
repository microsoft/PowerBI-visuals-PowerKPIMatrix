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

import { SeriesSettings } from "../../settings/seriesSettings";
import { IVisualComponentStateBase } from "../../visualComponent/visualComponentStateBase";
import { ISettingsServiceItem } from "../settingsService";
import { State } from "./state";

export interface ISettingsState extends IVisualComponentStateBase {
    [seriesName: string]: SeriesSettings;
}

export class SettingsState extends State<ISettingsState> {
    public get hasBeenUpdated(): boolean {
        return !this.areStatesEqual(
            this.state,
            { ...this.state, ...this.tempState },
        );
    }
    private tempState: ISettingsState = {};

    public setSeriesSettings(seriesName: string, settings: SeriesSettings) {
        if (this.tempState[seriesName]) {
            return;
        }

        this.tempState[seriesName] = settings;
    }

    public getSeriesSettings(seriesName: string): powerbi.DataViewObjects {
        return (this.state[seriesName] as any) || undefined;
    }

    public reset() {
        this.tempState = {};
    }

    public save(): ISettingsServiceItem[] {
        const state: ISettingsState = {
            ...this.state,
            ...this.tempState,
        };

        const serializedState: string = this.serializeState(state);

        this.reset();

        return [{
            objectName: "internalState",
            properties: {
                settings: serializedState,
            },
            selectionId: null,
        }];
    }

    public parse(value: ISettingsState): void {
        this.reset();

        super.parse(value);
    }

    private areStatesEqual(oldState: ISettingsState, newState: ISettingsState): boolean {
        try {
            return JSON.stringify(oldState) === JSON.stringify(newState);
        } catch (_) {
            return false;
        }
    }
}
