import { Check, X } from "lucide-react";
import { approveQuoteRequest, rejectQuoteRequest } from "@/app/admin/requests/actions";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RequestStatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { degreeLevels, servicePackages } from "@/lib/mock-data";
import { listQuoteRequests } from "@/lib/supabase/quote-requests";
import { formatDateTime, formatVnd } from "@/lib/utils";

function packageLabel(id: string) {
  return servicePackages.find((p) => p.id === id)?.name ?? id;
}

function degreeLevelLabel(value: string) {
  return degreeLevels.find((d) => d.value === value)?.label ?? value;
}

export default async function AdminRequestsPage() {
  const requests = await listQuoteRequests();

  return (
    <>
      <AdminPageHeader
        title="Yêu cầu"
        description="Danh sách yêu cầu báo giá gửi từ trang chủ, chờ đội ngũ duyệt."
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Liên hệ</TableHead>
              <TableHead>Quốc gia · Bậc học</TableHead>
              <TableHead>Gói dịch vụ</TableHead>
              <TableHead>Báo giá</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Chưa có yêu cầu báo giá nào.
                </TableCell>
              </TableRow>
            )}
            {requests.map((req) => (
              <TableRow key={req.id}>
                <TableCell className="font-medium">
                  <div>{req.email}</div>
                  <div className="text-xs font-normal text-muted-foreground">{req.phone}</div>
                </TableCell>
                <TableCell>
                  {req.country} · {degreeLevelLabel(req.degreeLevel)}
                </TableCell>
                <TableCell>{packageLabel(req.package)}</TableCell>
                <TableCell>{formatVnd(req.price)}</TableCell>
                <TableCell>
                  <RequestStatusBadge status={req.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDateTime(req.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    <form action={approveQuoteRequest.bind(null, req.id)}>
                      <Button type="submit" size="icon-sm" variant="outline" aria-label="Duyệt">
                        <Check className="size-3.5" />
                      </Button>
                    </form>
                    <form action={rejectQuoteRequest.bind(null, req.id)}>
                      <Button type="submit" size="icon-sm" variant="outline" aria-label="Từ chối">
                        <X className="size-3.5" />
                      </Button>
                    </form>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
