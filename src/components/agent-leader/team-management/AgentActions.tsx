'use client';

import React from 'react';
import { MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { IsActive } from '@/types/user.types';

interface AgentActionsProps {
  agentId?: string;
  agentStatus?: IsActive | undefined;
  onViewDetails: () => void;
  onViewCustomers?: () => void;
  onEdit?: () => void;
  onToggleBlock?: () => void;
  // onDelete: () => void;
}

export function AgentActions({
  // agentStatus,
  onViewDetails,
  // onViewCustomers,
  // onEdit,
  // onToggleBlock,
  // onDelete,
}: AgentActionsProps) {
  // const isBlocked = agentStatus === IsActive.BLOCKED;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onViewDetails} className="gap-2 cursor-pointer">
          <Eye className="w-4 h-4" />
          View Details
        </DropdownMenuItem>

        {/* <DropdownMenuItem onClick={onViewCustomers} className="gap-2 cursor-pointer">
          <Users className="w-4 h-4" />
          View Customers
        </DropdownMenuItem>

        <DropdownMenuItem onClick={onEdit} className="gap-2 cursor-pointer">
          <Edit className="w-4 h-4" />
          Edit
        </DropdownMenuItem> */}

        <DropdownMenuSeparator />

        {/* <DropdownMenuItem onClick={onToggleBlock} className="gap-2 cursor-pointer">
          {isBlocked ? (
            <>
              <LockOpen className="w-4 h-4" />
              Unblock Agent
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Block Agent
            </>
          )}
        </DropdownMenuItem> */}

        {/* <DropdownMenuSeparator /> */}

        {/* <DropdownMenuItem
          onClick={onDelete}
          className="gap-2 cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </DropdownMenuItem> */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
