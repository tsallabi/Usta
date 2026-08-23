/**
 * تجميع التقييمات — النمط الواحد المُعاد استخدامه في كل مكان.
 *
 * تقييم الزبون للأسطى = متوسط 5 أبعاد (الالتزام بالوقت، جودة الشغل،
 * الالتزام بالسعر، التعامل، التواصل) لكل شغلة، ثم متوسط الشغلات.
 * الأسطى المُقيَّم يُشتق من عرضه المقبول على الطلب — بدون عمود إضافي.
 *
 * D1/SQLite: "NULLS LAST" غير مدعوم — نستخدم `avg_rating IS NULL` كمفتاح
 * ترتيب أول (0 = عنده تقييم، 1 = بدون) ثم `avg_rating DESC`.
 */

/**
 * تعبير SQL فرعي يُرجع متوسط تقييم الأسطى (مقرّب لخانة عشرية) — أو NULL.
 * `tradesmanIdExpr` هو تعبير عمود id الأسطى في الاستعلام الخارجي
 * (مثلاً "t.id" أو "o.tradesman_id") — يُدرج نصياً، لا تمرّر مدخلات مستخدم.
 */
export function avgRatingSql(tradesmanIdExpr: string): string {
  return `(SELECT ROUND(AVG((r.punctuality + r.quality + r.price_adherence +
                             r.professionalism + r.communication) / 5.0), 1)
             FROM ratings r
             JOIN offers ao ON ao.job_id = r.job_id AND ao.status = 'accepted'
            WHERE r.rater = 'customer' AND ao.tradesman_id = ${tradesmanIdExpr})`;
}

/** تعبير SQL فرعي يُرجع عدد تقييمات الزبائن للأسطى. */
export function ratingsCountSql(tradesmanIdExpr: string): string {
  return `(SELECT COUNT(*)
             FROM ratings r
             JOIN offers ao ON ao.job_id = r.job_id AND ao.status = 'accepted'
            WHERE r.rater = 'customer' AND ao.tradesman_id = ${tradesmanIdExpr})`;
}
