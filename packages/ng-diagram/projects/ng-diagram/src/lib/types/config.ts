import { DeepPartial, FlowConfig } from '../../core/src';

/**
 * The recommended configuration type for ng-diagram.
 *
 * This type allows you to provide only the configuration options you want to override.
 * All properties are optional and correspond to those in {@link FlowConfig}.
 *
 * @see {@link FlowConfig} – for the full list of available configuration options
 * @see {@link NgDiagramComponent}
 * @see {@link NgDiagramService}
 *
 * @example
 * ```ts
 * // define configuration in a component
 * const config: NgDiagramConfig = {
 *   zoom: { max: 3 },
 *   edgeRouting: { defaultRouting: 'orthogonal' },
 * };
 * ```
 * @example
 * ```html
 * <!-- use configuration in your template with ngDiagram -->
 * <ng-diagram [config]="config"></ng-diagram>
 * ```
 *
 * @public
 * @since 0.8.0
 * @category Types/Configuration
 */
export type NgDiagramConfig = DeepPartial<FlowConfig>;
