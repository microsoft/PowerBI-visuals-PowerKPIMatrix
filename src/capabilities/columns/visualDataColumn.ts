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

namespace powerbi.extensibility.visual {
    export interface VisualDataRole {
        /** Unique name for the VisualDataRole. */
        name: string;

        /** Indicates the kind of role.  This value is used to build user interfaces, such as a field well. */
        kind: any;

        displayName?: any;

        /** The tooltip text */
        description?: any;

        /** Indicates the preferred ValueTypes to be used in this data role.  This is used by authoring tools when adding fields into the visual. */
        preferredTypes?: any[];

        /** Indicates the required ValueTypes for this data role. Any values which do not match one of the ValueTypes specified will be null'd out */
        requiredTypes?: any[];

        /** Indicates the cartesian role for the visual role */
        cartesianKind?: any;

        /** Indicates the join predicate behavior of items in this role. */
        joinPredicate?: any;
    }

    export interface VisualDataColumn extends VisualDataRole {
        mappingDisplayName?: string;
        emptyValues?: string[];
        helpMessage?: string;
    }
}