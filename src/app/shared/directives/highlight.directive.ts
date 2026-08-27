import { Directive, ElementRef, HostListener, input } from '@angular/core';

// Attribute directive — attaches behaviour directly to a host element.
// This is Angular's mechanism for reusable DOM manipulation without wrapping
// the element in another component.
//
// React equivalent: a custom hook that attaches event listeners via useEffect
// and returns ref + handlers, e.g. const { ref } = useHighlight(color)
//
// Usage in a template:
//   <tr appHighlight highlightColor="#fff8e1">...</tr>
//   <div appHighlight>...</div>   ← uses default colour
//
// The directive is standalone and must be imported wherever it is used.

@Directive({
  selector: '[appHighlight]',
  standalone: true
})
export class HighlightDirective {

  // Signal-based input (Angular 17+).
  // Parent passes the colour like [highlightColor]="'#fef3c7'"
  // Defaults to a soft amber if nothing is provided.
  highlightColor = input<string>('#fef9c3');

  constructor(private el: ElementRef<HTMLElement>) {}

  // HostListener — attaches a DOM event listener to the host element.
  // Angular automatically removes it when the directive is destroyed.
  // React equivalent: el.addEventListener('mouseenter', handler) in useEffect.
  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.el.nativeElement.style.backgroundColor = this.highlightColor();
    this.el.nativeElement.style.transition = 'background-color 0.15s ease';
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.el.nativeElement.style.backgroundColor = '';
  }
}
