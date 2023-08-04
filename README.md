# Speactive ✨

Speactive is a very lightweight library for building reactive user interfaces for the web.
You might find the developer experience and the way of building the UI weird and tedious but I like it 🙃

## How does it work?

Unlike React Speactive doesn't use a virtual DOM. Instead Speactive uses an _updater_ system.
Every components have a list of attached updaters. When a value used in a component changes, it triggers the updater associated to that value. Of course a single updater can be linked to multiple values but a value cannot be linked to multiple updaters (subject to change though).

All reactive data are stored in _Remembered Objects_. These special objects use the [Proxy object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) to intercept changes to its members. From there change of value can be detected and the updaters triggered.

When instantiating a component a list of _Remembered Objects_ (with a bit more data) is given to the component so the instance can subscribe to the changes in the _Remembered Object_.

Now that reactivity is settled let's talk about how components are made shall we? Component creation is _kinda_ hard. It's not that hard but compared to other libraries or frameworks it is more complicated. Speactive is way more close to the DOM. As I said, what updates the DOM are updaters. The library comes with 3 already made updaters (inner text of an element, a HTML attribute and a CSS style). Most of the time those updaters won't be enough and you'll need to write your own updaters which makes it harder as you have to think about mounting, unmounting, etc. Some might find this horrible but I like it for one simple reason: I know what is happening under the hood and that's what makes Speactive **_blazingly fast_** (even though this qualification is complete nonsense nowadays as even slow libraries full of useless code are considered blazingly fast)

## An example

I'll use TypeScript because that's what I used to make the library. You might find repetitive code (especially in generics) as I still need to master TypeScript (Matt I'm coming!)

Let's make a simple Text component that displays the given text

```ts
import {
  Component,
  type DataSources,
  type RememberedArg,
} from '@richarddorian/speactive';

interface TextFields {
  text: string;
}

// First generic represents the fields for this component (a.k.a.
// props in React but my french brain named it fields don't ask why).

// Second generic is the tag name for the root HTML element (this is the part
// where it needs to be improved as we see the same string in the constructor)
class TextComponent extends Component<TextFields, 'span'> {
  // Let the boiler plate begin!

  // The dataSources argument is an object containing a function
  // for each field. This function is called a data source.

  // The second argument is the remembered argument. An array of objects, each
  // object represents a remembered object. Other details such as which field uses
  // what property of the remembered object are also included in this object.
  public constructor(
    dataSources: DataSources<TextFields>,
    remembered: RememberedArg<TextFields>,
  ) {
    // Calling the constructor of the Component class. We pass the data sources and the
    // remembered argument. The second argument is the tag of the root element. The `root`
    // property is created by the superclass constructor. The root element can be accessed
    // with `this.root`. And it is typed which means putting span here will result in `this.root`
    // being an `HTMLSpanElement`, etc.
    super(dataSources, 'span', remembered);

    // Here we set the inner text of span element with the content of the text data source (text field).
    // Every time the text field value is updated the updater created by this method will run and update
    // the inner text. This method can take a second element which is which element to set the inner text
    // of. By default it is the root element.
    super.setInnerText('text');
  }
}
```

This is a rather simple example as we only used an already made updater. Let's make one! Let's do a button component with a variant field that will put the value of that field as a CSS class.

```ts
import {
  Component,
  type DataSources,
  type RememberedArg,
} from '@richarddorian/speactive';

interface ButtonFields {
  variant: (typeof Button.Variants)[number]; // Same thing as 'primary' | 'secondary' | 'tertiary'
}

class Button extends Component<ButtonFields, 'button'> {
  public static Variants = ['primary', 'secondary', 'tertiary'] as const;

  public constructor(
    dataSources: DataSources<ButtonFields>,
    remembered: RememberedArg<ButtonFields>,
  ) {
    super(dataSources, 'button', remembered);

    this.setVariant();
  }

  private setVariant() {
    // The updater function that will run whenever the value of variant updates
    const updater = () => {
      for (const variant in Button.Variants) {
        this.root.classList.remove(variant);
      }

      this.root.classList.add(variant);
    };

    updater(); // We run the updater as we just received its value but no update yet and we need to set the class
    // We tell Speactive that whenever variant changes we run the updater
    this.updaters.set('variant', updater);
  }
}
```

## Notes

Now you believe me when I say that it is tedious and really annoying to write components. Well my goal isn't to create the most practical performant library ever but it is mine and I like it. Especially I know what is happening under the hood and since the library is very small the _learning curve_ is very small as well. Therefore other developers can understand what is really happening because let's be honest: who really explored React's source code to learn how the virtual DOM is written and works and why our garbage code doesn't work the way we want. Nah what we did what StackOverflow it and moved on with our lives. So yeah it is harder but it's performant and I know what's going on.

The thing is that today React (and many others) let developers write their own stuff with DOM elements. When we compare to other platforms (such as Android) developers often use already made components and just edit their design to match their stupidly hard Figma design. Here in the web world developers need to write the Button component every time they start a project. Do weird CSS wizardry to align the icon and the text vertically when we could use another approach: use already made components. So yeah at some point someone will have to write that awful code but that's for a greater good!

## JSX 🤔

In a world where my approach is the way (This is the way!) developers will (almost) never have to touch HTML elements ever again. If it becomes the case my library becomes usable... _sorta_.

Let's take the `TextComponent` from before, add a counter variable and increment it every 100ms.

```ts
import { remember } from '@richarddorian/speactive';
import { TextComponent } from '../../hard/hierarchy/for/no/reason';

// The remembered object (it's typed btw)
const counter = remember({ value: 0 });

const textUI = new TextComponent(
  {
    text: () => `Counter: ${counter.value}`,
  },
  [
    {
      // The remembered object
      '_#remember': counter,
      // The text field depends on the value member of the remembered object
      text: ['value'],
    },
  ],
);

// Increment every 100ms
setTimeout(() => counter.value++, 100);

// Mount to DOM
document.body.appendChild(textUI.root);
```

As you can see it's horrible and almost unreadable. Later on a transpiler will be written to convert JSX to this weird thing you just saw and don't want to see again. The same code would then be:

```tsx
import { remember } from '@richarddorian/speactive';
import { TextComponent } from '../../hard/hierarchy/for/no/reason';

// The remembered object (it's typed btw)
const counter = remember({ value: 0 });

const textUI = <TextComponent text={`Counter: ${counter.value}`} />;

// Increment every 100ms
setTimeout(() => counter.value++, 100);

// Mount to DOM
document.body.appendChild(textUI.root);
```

Much better right? Now all React developers I lost can continue reading as I'll use JSX from now on. Just kidding this is the end.
