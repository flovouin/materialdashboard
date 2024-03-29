# materialdashboard

`materialdashboard` is a Dash component library exposing [Material-UI](https://next.material-ui.com/) components.

Dash components are automatically generated using TypeScript definitions from the source React components.

## Installation

```bash
pip install materialdashboard
```

Although it is not listed in the requirements for this package, you will obviously need [Dash](https://dash.plotly.com/) to include the components in a web app.

## Documentation

Although the component properties should be documented from the extracted TypeScript comments, please refer to the [Material-UI documentation](https://mui.com/components/) for more information about each component.

## Examples

Examples can be found on [GitHub](https://github.com/flovouin/materialdashboard/tree/master/examples):

-   [Layout](https://github.com/flovouin/materialdashboard/blob/master/examples/layout.py) (mostly the `Grid` component)
-   [Input components](https://github.com/flovouin/materialdashboard/blob/master/examples/inputs) (buttons, selects, switches, text fields, etc.)

# Limitations

### Child nodes

Child nodes are only supported for the `children` property of each component. If Material-UI components expect child components for properties other than `children`, you will not be able to pass a Dash component to them. You can however pass other types. For example, a string is a valid child node.

### Events

Not all events are implemented. Currently, all components support clicks through the `n_clicks` property. If you need an event that's currently missing, please open an issue or a pull request.
