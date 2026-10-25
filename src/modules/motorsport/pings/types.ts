export interface MemberSource {
  id: string;
  members: { fetch(): Promise<unknown> };
}
