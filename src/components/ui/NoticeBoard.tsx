import { motion } from "framer-motion";
import { Bell, ChevronRight, Megaphone } from "lucide-react";

interface Notice {
  id: string;
  title: string;
  message: string;
  date: string;
  type: "info" | "important" | "update";
}

interface NoticeBoardProps {
  notices: Notice[];
}

export const NoticeBoard = ({ notices }: NoticeBoardProps) => {
  const typeStyles = {
    info: "border-l-trust",
    important: "border-l-urgency",
    update: "border-l-profit",
  };

  const typeIcons = {
    info: Bell,
    important: Megaphone,
    update: Bell,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-primary" />
          Notice Board
        </h3>
        <button className="text-sm text-primary hover:underline flex items-center gap-1">
          View all
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {notices.map((notice, index) => {
          const Icon = typeIcons[notice.type];
          return (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
              className={`bg-muted/30 rounded-lg p-4 border-l-4 ${typeStyles[notice.type]} hover:bg-muted/50 transition-colors cursor-pointer`}
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-muted">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm mb-1">{notice.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {notice.message}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    {notice.date}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
