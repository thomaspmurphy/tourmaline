class AddContentToForumThreads < ActiveRecord::Migration[8.0]
  def change
    add_column :forum_threads, :content, :text
  end
end
