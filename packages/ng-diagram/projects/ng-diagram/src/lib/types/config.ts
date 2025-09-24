import { DeepPartial, FlowConfig } from '../../core/src';

/**
 * `NgDiagramConfig` is the main configuration type for the ngDiagram library.
 * This configuration object allows you to override only the properties you need from the full {@link FlowConfig}.
 *
 * This type is used as the type for the `config` input in {@link NgDiagramComponent}
 * and throughout the public API, such as in {@link NgDiagramService}.
 *
 * Example usage:
 * ```ts
 * // define configuration in a component
 * const config: NgDiagramConfig = {
 *   zoom: { max: 3 },
 *   edgeRouting: { defaultRouting: 'orthogonal' },
 * };
 * ```
 * ```html
 *  <!-- use configuration in your template with ngDiagram -->
 *   <ng-diagram [config]="config"></ng-diagram>
 * ```
 *
 * @category Types
 */
export type NgDiagramConfig = DeepPartial<FlowConfig>;
