-- Baseline RLS policies for Supabase API access.
-- Server-side Prisma uses the database connection and is not intended to rely on anon policies.

-- Public read surfaces
CREATE POLICY "Public can read public pets" ON "Pet"
  FOR SELECT USING ("isPublic" = true);

CREATE POLICY "Public can read approved public posts" ON "Post"
  FOR SELECT USING ("visibility" = 'PUBLIC' AND "moderationStatus" = 'APPROVED');

CREATE POLICY "Public can read approved comments" ON "Comment"
  FOR SELECT USING ("moderationStatus" = 'APPROVED');

CREATE POLICY "Public can read events" ON "Event"
  FOR SELECT USING (true);

CREATE POLICY "Public can read published adoptions" ON "Adoption"
  FOR SELECT USING ("status" = 'PUBLISHED');

CREATE POLICY "Public can read verified businesses" ON "Business"
  FOR SELECT USING ("verified" = true);

CREATE POLICY "Public can read active campaigns" ON "Campaign"
  FOR SELECT USING ("status" = 'ACTIVE');

CREATE POLICY "Public can read approved ads" ON "Ad"
  FOR SELECT USING ("moderationStatus" = 'APPROVED');

-- Authenticated users can manage their own pet profiles.
CREATE POLICY "Users can create own pets" ON "Pet"
  FOR INSERT TO authenticated
  WITH CHECK ("ownerId" = auth.uid()::text);

CREATE POLICY "Users can update own pets" ON "Pet"
  FOR UPDATE TO authenticated
  USING ("ownerId" = auth.uid()::text)
  WITH CHECK ("ownerId" = auth.uid()::text);

CREATE POLICY "Users can delete own pets" ON "Pet"
  FOR DELETE TO authenticated
  USING ("ownerId" = auth.uid()::text);

-- Authenticated users can manage their own posts and reactions.
CREATE POLICY "Users can create own posts" ON "Post"
  FOR INSERT TO authenticated
  WITH CHECK ("authorId" = auth.uid()::text);

CREATE POLICY "Users can update own posts" ON "Post"
  FOR UPDATE TO authenticated
  USING ("authorId" = auth.uid()::text)
  WITH CHECK ("authorId" = auth.uid()::text);

CREATE POLICY "Users can delete own posts" ON "Post"
  FOR DELETE TO authenticated
  USING ("authorId" = auth.uid()::text);

CREATE POLICY "Users can create own comments" ON "Comment"
  FOR INSERT TO authenticated
  WITH CHECK ("authorId" = auth.uid()::text);

CREATE POLICY "Users can update own comments" ON "Comment"
  FOR UPDATE TO authenticated
  USING ("authorId" = auth.uid()::text)
  WITH CHECK ("authorId" = auth.uid()::text);

CREATE POLICY "Users can delete own comments" ON "Comment"
  FOR DELETE TO authenticated
  USING ("authorId" = auth.uid()::text);

CREATE POLICY "Users can create own reactions" ON "Reaction"
  FOR INSERT TO authenticated
  WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Users can delete own reactions" ON "Reaction"
  FOR DELETE TO authenticated
  USING ("userId" = auth.uid()::text);

-- Authenticated users can submit reports.
CREATE POLICY "Users can create reports" ON "Report"
  FOR INSERT TO authenticated
  WITH CHECK ("reporterId" = auth.uid()::text);

CREATE POLICY "Users can read own reports" ON "Report"
  FOR SELECT TO authenticated
  USING ("reporterId" = auth.uid()::text);

-- Public ad tracking writes. Keep intentionally narrow.
CREATE POLICY "Public can create ad impressions" ON "AdImpression"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can create ad clicks" ON "AdClick"
  FOR INSERT WITH CHECK (true);
