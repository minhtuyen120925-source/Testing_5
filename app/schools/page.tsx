import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listSchools } from "@/lib/supabase/schools";

// Danh sách trường có thể thay đổi qua thời gian — luôn lấy mới mỗi lần
// vào trang, không để Next.js đóng băng thành trang tĩnh lúc build.
export const dynamic = "force-dynamic";

export default async function SchoolsPage() {
  const schools = await listSchools();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 pb-24 pt-32">
        <h1 className="text-balance text-3xl font-medium tracking-tight md:text-4xl">
          Điểm chuẩn các trường
        </h1>
        <p className="mt-3 max-w-lg text-muted-foreground">
          Mức điểm học tập và IELTS tối thiểu cần đạt để đủ điều kiện nộp hồ sơ vào từng trường.
        </p>

        <Card className="mt-10">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên trường</TableHead>
                <TableHead>Quốc gia</TableHead>
                <TableHead>Điểm học tập tối thiểu</TableHead>
                <TableHead>Điểm IELTS tối thiểu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Chưa có dữ liệu điểm chuẩn.
                  </TableCell>
                </TableRow>
              )}
              {schools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell className="font-medium">{school.name}</TableCell>
                  <TableCell>{school.country}</TableCell>
                  <TableCell>{school.minGpa.toFixed(1)}</TableCell>
                  <TableCell>{school.minIelts.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
