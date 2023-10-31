import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'linkify'
})
export class LinkifyPipe implements PipeTransform {

  transform(value: string, postId: number): string {
    return this.linkify(value, postId);
  }

  // private linkify(text: string): string {
  //   const urlRegex = /(https?:\/\/[^\s]+)/g;
  //   return text.replace(urlRegex, url => `<a href="${url}" target="_blank">${url}</a>`);
  // }
  private linkify(text: string, postId: number): string {
    let linkifiedContent = text;

    // Linkify URLs
    linkifiedContent = linkifiedContent?.replace(/https?:\/\/[^\s]+/g, url => `<a href="${url}" class="external-link" target="_blank">${url}</a>`);

    // Linkify #tags
    linkifiedContent = linkifiedContent?.replace(/#(\w+)/g, `<a href="/search/$1">#$1</a>`);

    // Linkify @usernames
    linkifiedContent = linkifiedContent?.replace(/@(\w+)/g, `<a href="/$1" class="user-link" data-username="$1" data-post-id="${postId}" (mouseover)="showPopover($1, postId)" (mouseout)="hidePopover()">@$1</a>`);

    return linkifiedContent;
  }
}

