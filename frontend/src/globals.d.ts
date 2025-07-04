/* eslint-disable */
/// <reference types="react" />
/// <reference types="react-dom" />

declare namespace JSX {
  interface Element extends React.ReactElement<any, any> { }
  interface ElementClass extends React.Component<any> {
    render(): React.ReactNode
  }
  interface ElementAttributesProperty {
    props: any
  }
  interface ElementChildrenAttribute {
    children: any
  }
  interface IntrinsicAttributes extends React.Attributes { }
  interface IntrinsicClassAttributes<T> extends React.ClassAttributes<T> { }
  interface IntrinsicElements {
    [tagName: string]: any
  }
}
