import * as ts from 'typescript';
import { customizeComponent } from './component-customization';

import { ComponentView, ComponentViewProperty } from './templating';
import { ComponentDefinition, ComponentProperty } from './type-checking';

/**
 * Creates a string representing the `PropType` from the given TypeScript type.
 *
 * @param sourceType The type of the property for which the `PropType` must be created.
 * @param checker The type checker to use.
 * @param allowComplexTypes Whether complex types, like React nodes or union are allowed (useful when this is called
 *     recursively, but we don't want to allow more than one recursion).
 * @returns The `PropType` for this property.
 */
function createPropType(sourceType: ts.Type, checker: ts.TypeChecker, allowComplexTypes = true): string {
    function fail() {
        throw new Error(`Failed to find propType for ${checker.typeToString(sourceType)}.`);
    }

    if (ts.TypeFlags.Boolean & sourceType.flags) {
        return 'PropTypes.bool';
    }

    if (ts.TypeFlags.NumberLike & sourceType.flags) {
        return 'PropTypes.number';
    }

    if (ts.TypeFlags.StringLike & sourceType.flags) {
        return 'PropTypes.string';
    }

    if ((ts.TypeFlags.Unknown | ts.TypeFlags.Any) & sourceType.flags) {
        return 'PropTypes.any';
    }

    if (!allowComplexTypes) {
        fail();
    }

    if (checker.typeToString(sourceType) === 'ReactNode') {
        return 'PropTypes.node';
    }

    if (sourceType.isUnion()) {
        const unionType = sourceType as ts.UnionType;

        // If at least one of the types is not a literal, we'll need to recursively determine the types that are
        // allowed. If all types are literal, we can simply list the values and be done with it.
        if (unionType.types.findIndex(t => (ts.TypeFlags.Literal & t.flags) === 0) >= 0) {
            const types = unionType.types.map(t => createPropType(t, checker, false));
            return `PropTypes.oneOfType([${types.join(', ')}])`
        } else {
            const values = unionType.types.map(t => checker.typeToString(t));
            return `PropTypes.oneOf([${values.join(', ')}])`;
        }
    }

    fail();
}

/**
 * Converts a list of properties extracted from TypeScript definitions to property "views" that can be used for Dash
 * component generation.
 *
 * @param properties The properties to convert.
 * @param checker The type checker to use.
 * @returns The property "views".
 */
function convertComponentPropertiesToView(properties: ComponentProperty[],
                                          checker: ts.TypeChecker): ComponentViewProperty[] {
    return properties.flatMap(property => {
        if (['component', 'classes', 'innerRef', 'style'].includes(property.name)
            || property.name.startsWith('aria-')) {
            console.warn(`Skipping property ${property.name}.`);
            return [];
        }

        try {
            let propType: string;
            // TODO(flo): Move inside `createPropType`.
            if ((checker.typeToString(property.type) === 'ReactNode') && (property.name !== 'children')) {
                // Dash only supports the `children` property to pass child nodes. However other `ReactNode` properties
                // might still be worth exposing as `any` such that we can still pass a string to them for example.
                console.warn(`Defining node property ${property.name} as any instead of ReactNode.`);
                propType = 'PropTypes.any';
            } else {
                propType = createPropType(property.type, checker);
            }

            return { ...property, propType, forwardProperty: true };
        } catch (e) {
            console.warn(`Could not create PropType, skipping property ${property.name}: ${e}`);
        }

        return [];
    })
}

/**
 * Create a component view from a component definition extracted from TypeScript.
 *
 * @param componentDefinition The component extracted from TypeScript definitions.
 * @param checker The type checker to use.
 * @returns The component view.
 */
export function createView(componentDefinition: ComponentDefinition, checker: ts.TypeChecker): ComponentView {
    const properties = convertComponentPropertiesToView(componentDefinition.properties, checker);
    const componentView = customizeComponent({
        name: componentDefinition.name,
        properties: properties,
        events: [],
    });
    return componentView;
}