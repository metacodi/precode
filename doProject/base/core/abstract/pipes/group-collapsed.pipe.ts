import { Pipe, PipeTransform } from '@angular/core';


@Pipe({
  name: 'groupCollapsed',
  pure: true,
})
export class GroupCollapsedPipe implements PipeTransform {

  constructor(
  ) {}

  transform(group: any, host: any): string {
    const status = (host.collapsed as any[]).find(g => g.key === group.key);
    return status ? status.value : false;
  }

}
