class CreateForumThreads < ActiveRecord::Migration[8.0]
  def change
    create_table :forum_threads do |t|
      t.string :title
      t.references :user, null: false, foreign_key: true
      t.datetime :last_activity_at

      t.timestamps
    end
  end
end
