create index admin_audit_log_target_user_idx
  on public.admin_audit_log(target_user_id)
  where target_user_id is not null;
create index admin_roles_granted_by_idx
  on public.admin_roles(granted_by)
  where granted_by is not null;
create index blog_posts_author_idx on public.blog_posts(author_id);
create index site_settings_updated_by_idx
  on public.site_settings(updated_by)
  where updated_by is not null;
